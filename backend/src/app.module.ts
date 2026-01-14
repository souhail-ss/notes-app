import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesModule } from './notes/notes.module';
import { CategoriesModule } from './categories/categories.module';
import { Note } from './notes/note.entity';
import { Category } from './categories/category.entity';

@Module({
  imports: [
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
