import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class GetUserByIdService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
}
