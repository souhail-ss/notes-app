import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: 'text' })
  type: string;

  @Column({ type: 'simple-json', nullable: true })
  listItems: Array<{ id: string; text: string; completed: boolean }> | null;

  @Column({ default: 'transparent' })
  color: string;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => Category, (category) => category.notes, { 
    nullable: true,
    onDelete: 'SET NULL' 
  })
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
