import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from '../../domain/entities/user.entity';

/**
 * Locks the user's row until the transaction ends, so a user's orders are
 * created one at a time: the next one waits and then sees the balances the
 * previous one left.
 */
@Injectable()
export class LockUserService {
  async execute(manager: EntityManager, userId: number): Promise<User | null> {
    return manager.findOne(User, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });
  }
}
