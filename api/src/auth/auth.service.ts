import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
// @ts-ignore
import { User } from 'generated/prisma';

type PublicUser = Omit<User, 'password'>;

type AuthResponse = Promise<{
  jwtToken: { access_token: string };
  user: PublicUser;
}>;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  /**
   * Creates a new user account (Email/Password).
   * Called by the signup controller.
   */
  async signup(signupDto: SignupDto) : AuthResponse {
    const { email, password, userName, firstName, lastName } = signupDto;

    const userExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { userName }],
      },
    });

    if (userExists) {
      if (userExists.email === email) {
        throw new ConflictException('Email already in use');
      }
      if (userExists.userName === userName) {
        throw new ConflictException('Username already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userName,
        firstName,
        lastName,
      },
    });

    // Auto-login: Call the private token generator
    return this.generateJwtAndUser(newUser);
  }

  /**
   * Generates a JWT for an already validated user.
   * Called by the login controller and google callback controller.
   */
  async login(user: User): AuthResponse {
    return this.generateJwtAndUser(user);
  }

  /**
   * Validates a user's password for the LocalStrategy.
   * Does NOT generate a token.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (
      user &&
      user.password &&
      (await bcrypt.compare(pass, user.password))
    ) {
      const { password, ...result } = user;
      return result; // Return the user object (without password)
    }
    return null; // Let Passport handle the failure
  }

  /**
   * Finds an existing user or creates a new one for Google OAuth.
   * Called by the GoogleStrategy.
   */
  async validateOAuthUser(profile: any) {
    const { email, firstName, lastName, profileImage } = profile;

    let user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      return user;
    }

    // Create a unique username for the new user
    const newUserName = `${firstName.toLowerCase().replace(/\s/g, '')}${Date.now()}`;

    const newUser = await this.prisma.user.create({
      data: {
        email: email,
        userName: newUserName,
        firstName: firstName,
        lastName: lastName,
        profileImage: profileImage,
        password: null, // No password for OAuth users
      },
    });

    return newUser;
  }

  /**
   * PRIVATE HELPER: Takes a user and returns a token and user object.
   */
  private async generateJwtAndUser(
    user: User,
  ): AuthResponse {
    
    const jwtToken = {
      access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
    };

    const { password, ...publicUser } = user;

    return {
      jwtToken,
      user: publicUser,
    };
  }
}