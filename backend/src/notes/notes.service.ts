import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto, UpdateNoteDto, ReorderNotesDto, BulkOperationDto } from './note.dto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async findAll(userId: number): Promise<Note[]> {
    return this.notesRepository.find({
      where: { userId, isArchived: false },
      relations: ['category'],
      order: { isPinned: 'DESC', order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByCategory(categoryId: number, userId: number): Promise<Note[]> {
    return this.notesRepository.find({
      where: { categoryId, userId, isArchived: false },
      relations: ['category'],
      order: { isPinned: 'DESC', order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findPinned(userId: number): Promise<Note[]> {
    return this.notesRepository.find({
      where: { isPinned: true, isArchived: false, userId },
      relations: ['category'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async create(createNoteDto: CreateNoteDto, userId: number): Promise<Note> {
    const maxOrder = await this.notesRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .select('MAX(note.order)', 'max')
      .getRawOne();

    const note = this.notesRepository.create({
      ...createNoteDto,
      userId,
      order: (maxOrder?.max || 0) + 1,
    });
    return this.notesRepository.save(note);
  }

  async update(id: number, updateNoteDto: UpdateNoteDto, userId: number): Promise<Note> {
    this.logger.log(`[UPDATE] Starting update for note ID: ${id}`);

    const note = await this.notesRepository.findOne({
      where: { id, userId },
      relations: ['category']
    });

    if (!note) {
      this.logger.error(`[UPDATE] Note with ID ${id} not found or access denied`);
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    Object.assign(note, updateNoteDto);
    note.updatedAt = new Date();

    await this.notesRepository.save(note);

    const reloadedNote = await this.notesRepository.findOne({
      where: { id, userId },
      relations: ['category']
    });

    if (!reloadedNote) {
      throw new NotFoundException(`Failed to reload note with ID ${id}`);
    }

    this.logger.log(`[UPDATE] Complete`);
    return reloadedNote;
  }

  async reorder(reorderDto: ReorderNotesDto, userId: number): Promise<void> {
    for (const { id } of reorderDto.notes) {
      const note = await this.notesRepository.findOne({ where: { id, userId } });
      if (!note) {
        throw new ForbiddenException(`Note ${id} not found or access denied`);
      }
    }

    const updates = reorderDto.notes.map(({ id, order }) =>
      this.notesRepository.update({ id, userId }, { order }),
    );
    await Promise.all(updates);
  }

  async remove(id: number, userId: number): Promise<void> {
    const result = await this.notesRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
  }

  async findArchived(userId: number): Promise<Note[]> {
    return this.notesRepository.find({
      where: { isArchived: true, userId },
      relations: ['category'],
      order: { updatedAt: 'DESC' },
    });
  }

  async archive(id: number, userId: number): Promise<Note> {
    return this.update(id, { isArchived: true }, userId);
  }

  async unarchive(id: number, userId: number): Promise<Note> {
    return this.update(id, { isArchived: false }, userId);
  }

  async duplicate(id: number, userId: number): Promise<Note> {
    const original = await this.notesRepository.findOne({
      where: { id, userId },
      relations: ['category']
    });

    if (!original) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    const maxOrder = await this.getMaxOrder(userId);

    const duplicate = this.notesRepository.create({
      title: `${original.title} (Copy)`,
      content: original.content,
      type: original.type,
      listItems: original.listItems ? JSON.parse(JSON.stringify(original.listItems)) : null,
      color: original.color,
      categoryId: original.categoryId,
      userId,
      isPinned: false,
      isArchived: false,
      order: maxOrder + 1,
    });

    return this.notesRepository.save(duplicate);
  }

  async bulkDelete(dto: BulkOperationDto, userId: number): Promise<void> {
    for (const id of dto.ids) {
      await this.notesRepository.delete({ id, userId });
    }
  }

  async bulkArchive(dto: BulkOperationDto, userId: number): Promise<void> {
    for (const id of dto.ids) {
      await this.notesRepository.update({ id, userId }, { isArchived: true });
    }
  }

  private async getMaxOrder(userId: number): Promise<number> {
    const maxOrder = await this.notesRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .select('MAX(note.order)', 'max')
      .getRawOne();

    return maxOrder?.max || 0;
  }
}
