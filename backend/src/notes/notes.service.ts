import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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

  async findAll(): Promise<Note[]> {
    return this.notesRepository.find({
      where: { isArchived: false },
      relations: ['category'],
      order: { isPinned: 'DESC', order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByCategory(categoryId: number): Promise<Note[]> {
    return this.notesRepository.find({
      where: { categoryId, isArchived: false },
      relations: ['category'],
      order: { isPinned: 'DESC', order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findPinned(): Promise<Note[]> {
    return this.notesRepository.find({
      where: { isPinned: true, isArchived: false },
      relations: ['category'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    // Get the max order and set new note to be at the end
    const maxOrder = await this.notesRepository
      .createQueryBuilder('note')
      .select('MAX(note.order)', 'max')
      .getRawOne();
    
    const note = this.notesRepository.create({
      ...createNoteDto,
      order: (maxOrder?.max || 0) + 1,
    });
    return this.notesRepository.save(note);
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note> {
    this.logger.log(`[UPDATE] Starting update for note ID: ${id}`);
    this.logger.debug(`[UPDATE] Payload: ${JSON.stringify(updateNoteDto)}`);

    // Fetch existing note
    const note = await this.notesRepository.findOne({
      where: { id },
      relations: ['category']
    });

    if (!note) {
      this.logger.error(`[UPDATE] Note with ID ${id} not found`);
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    this.logger.debug(`[UPDATE] Before update: title="${note.title}", content="${note.content?.substring(0, 50)}...", isPinned=${note.isPinned}`);

    // Apply updates
    Object.assign(note, updateNoteDto);
    note.updatedAt = new Date();

    this.logger.debug(`[UPDATE] After merge: isPinned=${note.isPinned}`);

    // Save to database
    const savedNote = await this.notesRepository.save(note);
    this.logger.debug(`[UPDATE] After save: hasContent=${!!savedNote.content}, contentLength=${savedNote.content?.length || 0}`);

    // CRITICAL FIX: Reload from database to ensure all fields
    this.logger.log(`[UPDATE] Reloading note to ensure completeness...`);
    const reloadedNote = await this.notesRepository.findOne({
      where: { id },
      relations: ['category']
    });

    if (!reloadedNote) {
      this.logger.error(`[UPDATE] Failed to reload note ID ${id}`);
      throw new NotFoundException(`Failed to reload note with ID ${id}`);
    }

    this.logger.log(`[UPDATE] Complete - returning note with content: ${!!reloadedNote.content}`);
    return reloadedNote;
  }

  async reorder(reorderDto: ReorderNotesDto): Promise<void> {
    const updates = reorderDto.notes.map(({ id, order }) =>
      this.notesRepository.update(id, { order }),
    );
    await Promise.all(updates);
  }

  async remove(id: number): Promise<void> {
    const result = await this.notesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
  }

  async findArchived(): Promise<Note[]> {
    return this.notesRepository.find({
      where: { isArchived: true },
      relations: ['category'],
      order: { updatedAt: 'DESC' },
    });
  }

  async archive(id: number): Promise<Note> {
    return this.update(id, { isArchived: true });
  }

  async unarchive(id: number): Promise<Note> {
    return this.update(id, { isArchived: false });
  }

  async duplicate(id: number): Promise<Note> {
    const original = await this.notesRepository.findOne({
      where: { id },
      relations: ['category']
    });

    if (!original) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    const maxOrder = await this.getMaxOrder();

    const duplicate = this.notesRepository.create({
      title: `${original.title} (Copy)`,
      content: original.content,
      type: original.type,
      listItems: original.listItems ? JSON.parse(JSON.stringify(original.listItems)) : null,
      color: original.color,
      categoryId: original.categoryId,
      isPinned: false,
      isArchived: false,
      order: maxOrder + 1,
    });

    return this.notesRepository.save(duplicate);
  }

  async bulkDelete(dto: BulkOperationDto): Promise<void> {
    await this.notesRepository.delete(dto.ids);
  }

  async bulkArchive(dto: BulkOperationDto): Promise<void> {
    await this.notesRepository.update(dto.ids, { isArchived: true });
  }

  private async getMaxOrder(): Promise<number> {
    const maxOrder = await this.notesRepository
      .createQueryBuilder('note')
      .select('MAX(note.order)', 'max')
      .getRawOne();

    return maxOrder?.max || 0;
  }
}
