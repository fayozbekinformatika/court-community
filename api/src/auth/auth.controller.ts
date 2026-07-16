import { Controller,Post,Body, UseGuards,Request,Get,Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    async signup(@Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response) {

      const { jwtToken, user } = await this.authService.signup(signupDto);

      // Cookie cross-site bo'lsa SameSite=None, Secure=true bo'lishi kerak.
      // Lekin sizning holatingizda frontend/back bir-biriga bog'liq subdomainlarda bo'lgani uchun
      // domainni aniq beramiz: .onrender.com (ikkala hostga ham tushsin).
      res.cookie('access_token', jwtToken.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        expires: new Date(Date.now() + 1000 * 60 * 60), // 1 day
      });
        return user;
    }

    @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Request() req,
    @Res({ passthrough: true }) res: Response, // 5. Inject the Response object
  ) {
    // 6. Get the token and user from the service
    const { jwtToken, user } = await this.authService.login(req.user as any);

    // 7. Set the cookie on the response
    res.cookie('access_token', jwtToken.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
    });


    // 8. Return just the user data as the JSON payload
    return { user };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {
    // Passport.js handles the redirect. This code won't even run.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1. Find or create the user
    const user = await this.authService.validateOAuthUser(req.user);

    // 2. Generate our own JWT for this user
    const { jwtToken } = await this.authService.login(user);

    // 3. Set cookie (same as username/password login)
    res.cookie('access_token', jwtToken.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
    });

    return user;
  }


  @UseGuards(AuthGuard('jwt')) // This is our "key-checker" bouncer
  @Get('profile')
  getProfile(@Request() req) {
    // If the AuthGuard succeeds, our JwtStrategy has run,
    // validated the user, and attached them to req.user.
    // We just return the user object.
    return req.user;
  }
}
