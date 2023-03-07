import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BcryptService } from '../shared/hashing/bcrypt.service';
import { HashingService } from '../shared/hashing/hashing.service';
import { UserDto } from './dto/user.dto';
import { Users } from './entities/users.entity';
import { UsersService } from './users.service';

const userArray = [
  {
    id: 1,
    name: 'name #1',
    username: 'username #1',
    email: 'test1@example.com',
    password: 'pass123',
  },
  {
    id: 2,
    name: 'name #2',
    username: 'username #2',
    email: 'test2@example.com',
    password: 'pass123',
  },
];

const oneUser = {
  id: 1,
  name: 'name #1',
  username: 'username #1',
  email: 'test@example.com',
  password: 'pass123',
};

const createUser: UserDto = {
  name: 'name #1',
  username: 'username #1',
  email: 'test@example.com',
  password: 'pass123',
};

const updateUserByEmail = {
  name: 'name #1',
  username: 'username #1',
  email: 'test@example.com',
  password: 'pass123',
};

const updateUserByPassword = {
  name: 'name #1',
  username: 'username #1',
  email: 'test@example.com',
  password: 'pass123',
};

const updateProfileUser = {
  name: 'name #1',
  username: 'username #1',
  email: 'test@example.com',
  password: 'pass123',
};

const updateUser = {
  id: 1,
  name: 'name #1 update',
  username: 'username #1 update',
  email: 'test@example.com',
  password: 'pass123',
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<Users>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: HashingService,
          useClass: BcryptService,
        },
        {
          provide: getRepositoryToken(Users),
          useValue: {
            find: jest.fn().mockResolvedValue(userArray),
            findOne: jest.fn().mockResolvedValue(oneUser),
            findOneBy: jest.fn().mockResolvedValueOnce(oneUser),
            save: jest.fn().mockReturnValue(createUser),
            updateByEmail: jest.fn().mockResolvedValue(updateUserByEmail),
            updateByPassword: jest.fn().mockResolvedValue(updateUserByPassword),
            updateProfileUser: jest.fn().mockResolvedValue(updateProfileUser),
            update: jest.fn().mockReturnValue(updateUser),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<Users>>(getRepositoryToken(Users));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll() method', () => {
    it('should return an array of all users', async () => {
      const users = await service.findAll();
      expect(users).toEqual(userArray);
    });
  });

  describe('findByEmail() method', () => {
    it('should find a user by email', async () => {
      expect(await service.findByEmail('test@example.com')).toEqual(oneUser);
    });

    it('should throw an exception if it not found a user by email', async () => {
      repository.findOneBy = jest.fn().mockResolvedValueOnce(null);
      await expect(service.findByEmail('not a correct email')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('findById() method', () => {
    it('should find a user by id', async () => {
      expect(await service.findById('anyid')).toEqual(oneUser);
    });

    it('should throw an exception if it not found a user by id', async () => {
      repository.findOneBy = jest.fn().mockResolvedValueOnce(null);
      await expect(service.findById('not a correct id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create() method', () => {
    it('should create a new user', async () => {
      expect(
        await service.create({
          name: 'name #1',
          username: 'username #1',
          email: 'test@example.com',
          password: 'pass123',
        }),
      ).toEqual(createUser);
    });

    it('should return an exception if login fails', async () => {
      repository.save = jest.fn().mockRejectedValueOnce(null);
      await expect(
        service.create({
          name: 'not a correct name',
          username: 'not a correct username',
          email: 'not a correct email',
          password: 'not a correct password',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateByEmail() method', () => {
    it('should update a user by email', async () => {
      expect(await service.updateByEmail('test@example.com')).toEqual(
        updateUserByEmail,
      );
    });

    it('should return an exception if update by email fails', async () => {
      repository.save = jest.fn().mockRejectedValueOnce(null);
      await expect(
        service.updateByEmail('not a correct email'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateByPassword() method', () => {
    it('should update a user by password', async () => {
      expect(
        await service.updateByPassword('test@example.com', 'pass123'),
      ).toEqual(updateUserByPassword);
    });

    it('should return an exception if update by password fails', async () => {
      repository.save = jest.fn().mockRejectedValueOnce(null);
      await expect(
        service.updateByPassword('not a correct email', 'not correct password'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateProfileUser() method', () => {
    it('should update profile of a user by id', async () => {
      expect(
        await service.updateProfileUser('anyid', updateProfileUser),
      ).toEqual(updateProfileUser);
    });

    it('should return an exception if update profile user fails', async () => {
      repository.save = jest.fn().mockRejectedValueOnce(null);
      await expect(
        service.updateProfileUser('not a correct id', {
          name: 'not a correct name',
          username: 'not a correct username',
          email: 'not a correct email',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateUser() method', () => {
    it('should update a user by id', async () => {
      expect(await service.updateUser('anyid', updateUser)).toEqual(updateUser);
    });

    it('should return an exception if update profile user fails', async () => {
      repository.update = jest.fn().mockRejectedValueOnce(null);
      await expect(
        service.updateUser('not a correct id', {
          name: 'not a correct name',
          username: 'not a correct username',
          email: 'not a correct email',
          password: 'not a correct password',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('deleteUser() method', () => {
    it('should remove a user by id', async () => {
      const removeSpy = jest.spyOn(repository, 'remove');
      const user = await service.deleteUser('any id');
      expect(removeSpy).toBeCalledWith(oneUser);
      expect(user).toBeUndefined();
    });

    it('should throw an error if no user is found with an id', async () => {
      repository.findOneBy = jest.fn().mockResolvedValueOnce(undefined);
      await expect(service.deleteUser('bad id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOneBy).toBeCalledTimes(1);
    });
  });
});
