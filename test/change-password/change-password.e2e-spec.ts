import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../../src/app.module';
import { MailerService } from '../../src/shared/mailer/mailer.service';
import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../src/iam/login/guards/access-token/access-token.guard';

const user = {
  email: 'test@example.com',
  password: 'pass123',
};

describe('App (e2e)', () => {
  let app;
  let accessTokenJwt: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue({
        sendMail: jest.fn(() => true),
      })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  describe('should sign in and get a "live" JWT', () => {
    it('should authenticates user with valid credentials and provides a jwt token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'pass123',
        })
        .then(({ body }) => {
          accessTokenJwt = body.accessToken;
          expect(accessTokenJwt).toMatch(
            /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
          );

          expect(body).toEqual({
            sub: 1,
            expiresIn: '3600',
            audience: '127.0.0.1:3001',
            issuer: '127.0.0.1:3001',
            accessToken: accessTokenJwt,
            user: { name: 'name #1', email: 'test@example.com', id: 1 },
          });

          expect(HttpStatus.OK);
        });
    });
  });

  describe('ChangePasswordController (e2e) - [POST /api/auth/change-password]', () => {
    it('should change password an user', async () => {
      return await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessTokenJwt}`)
        .send(user)
        .then(({ body }) => {
          expect(body).toEqual({
            message: 'Request Change Password Successfully!',
            status: 200,
          });
          expect(HttpStatus.OK);
        });
    });
  });

  it('should throw an error for a bad email', async () => {
    return await request(app.getHttpServer())
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessTokenJwt}`)
      .send({
        password: 'new123456',
      })
      .then(({ body }) => {
        expect(body).toEqual({
          error: 'Bad Request',
          message: [
            'email should not be empty',
            'email must be a string',
            'email must be an email',
          ],
          statusCode: 400,
        });
        expect(HttpStatus.BAD_REQUEST);
        expect(new BadRequestException());
      });
  });

  it('should throw an error for a bad password', async () => {
    return await request(app.getHttpServer())
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessTokenJwt}`)
      .send({
        email: 'test@example.it',
      })
      .then(({ body }) => {
        expect(body).toEqual({
          error: 'Bad Request',
          message: [
            'password must be shorter than or equal to 60 characters',
            'password must be a string',
            'password should not be empty',
          ],
          statusCode: 400,
        });
        expect(HttpStatus.BAD_REQUEST);
        expect(new BadRequestException());
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
