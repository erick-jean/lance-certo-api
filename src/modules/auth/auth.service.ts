import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(login: LoginDto): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: login.email },
    });

    // If user is not found or is not active, throw an unauthorized exception
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare the provided password with the stored hashed password
    const passwordMatches = await bcrypt.compare(login.password, user.password);

    // If password does not match, throw an unauthorized exception
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      },
    });

    // Generate a JWT token for the authenticated user
    const payload = { sub: user.id, email: user.email };

    return {
      // 💡 Here the JWT secret key that's used for signing the payload
      // is the key that was passed in the JwtModule
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
