import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesModule } from './notes/notes.module';
import { CategoriesModule } from './categories/categories.module';
import { VoiceModule } from './voice/voice.module';
import { Note } from './notes/note.entity';
import { Category } from './categories/category.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [Note, Category],
            synchronize: true,
            ssl: {
              rejectUnauthorized: false,
            },
          }
        : {
            type: 'sqlite',
            database: 'mynotes.db',
            entities: [Note, Category],
            synchronize: true,
          },
    ),
    NotesModule,
    CategoriesModule,
    VoiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
