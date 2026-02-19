import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesModule } from './notes/notes.module';
import { CategoriesModule } from './categories/categories.module';
import { VoiceModule } from './voice/voice.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Note } from './notes/note.entity';
import { Category } from './categories/category.entity';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [Note, Category, User],
            synchronize: true,
            ssl: {
              rejectUnauthorized: false,
            },
          }
        : {
            type: 'sqlite',
            database: 'mynotes.db',
            entities: [Note, Category, User],
            synchronize: true,
          },
    ),
    NotesModule,
    CategoriesModule,
    VoiceModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
