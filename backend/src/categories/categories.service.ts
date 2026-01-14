import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name },
    });
    
    if (existing) {
      throw new ConflictException(`Category "${createCategoryDto.name}" already exists`);
    }
    
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async seed(): Promise<void> {
    const defaultCategories = [
      { name: 'Personal', icon: 'user', color: '#3b82f6' },
      { name: 'Work', icon: 'briefcase', color: '#f59e0b' },
      { name: 'Ideas', icon: 'lightbulb', color: '#ec4899' },
      { name: 'Goals', icon: 'target', color: '#8b5cf6' },
      { name: 'Recipes', icon: 'utensils', color: '#10b981' },
    ];

    for (const cat of defaultCategories) {
      const existing = await this.categoriesRepository.findOne({
        where: { name: cat.name },
      });
      if (!existing) {
        await this.categoriesRepository.save(this.categoriesRepository.create(cat));
      }
    }
  }
}
