import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Note } from '../notes/note.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'folder' })
  icon: string;

  @Column({ default: '#6366f1' })
  color: string;

  @OneToMany(() => Note, (note) => note.category)
  notes: Note[];
}
