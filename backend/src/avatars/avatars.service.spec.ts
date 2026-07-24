import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AvatarsService } from './avatars.service';
import { ImgAvatar } from './schemas/img-avatar.schema';
import { TypeAvatar } from './schemas/type-avatar.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('AvatarsService', () => {
  let service: AvatarsService;
  let typeAvatarModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
  };
  let imgAvatarModel: {
    find: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };

  beforeEach(async () => {
    typeAvatarModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };
    imgAvatarModel = {
      find: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarsService,
        { provide: getModelToken(TypeAvatar.name), useValue: typeAvatarModel },
        { provide: getModelToken(ImgAvatar.name), useValue: imgAvatarModel },
      ],
    }).compile();

    service = module.get(AvatarsService);
  });

  describe('createType', () => {
    it('tạo type mới thành công với đúng slug tính từ tên', async () => {
      typeAvatarModel.findOne.mockReturnValue(execResolves(null));
      typeAvatarModel.create.mockResolvedValue({ _id: 'type-1', name: 'Anime', slug: 'anime' });

      const result = await service.createType({ name: 'Anime' } as any);

      expect(typeAvatarModel.findOne).toHaveBeenCalledWith({ slug: 'anime' });
      expect(typeAvatarModel.create).toHaveBeenCalledWith({ name: 'Anime', slug: 'anime' });
      expect(result).toEqual(expect.objectContaining({ slug: 'anime' }));
    });

    it('tên trùng slug với type có sẵn -> ConflictException, không tạo mới', async () => {
      typeAvatarModel.findOne.mockReturnValue(execResolves({ _id: 'type-1', slug: 'anime' }));

      await expect(service.createType({ name: 'Anime' } as any)).rejects.toThrow(
        ConflictException,
      );
      expect(typeAvatarModel.create).not.toHaveBeenCalled();
    });
  });

  describe('createImage', () => {
    it('tạo image thành công, truyền thẳng dto cho model.create (không có bước kiểm tra trùng)', async () => {
      const dto = { url: 'https://cdn.example.com/a.png', type: 'type-1' };
      const created = { _id: 'img-1', ...dto };
      imgAvatarModel.create.mockResolvedValue(created);

      const result = await service.createImage(dto as any);

      expect(imgAvatarModel.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(created);
    });
  });

  describe('findImages', () => {
    const mockFind = (items: unknown[]) => {
      const chain = { sort: jest.fn(), exec: jest.fn() };
      chain.sort.mockReturnValue(chain);
      chain.exec.mockResolvedValue(items);
      imgAvatarModel.find.mockReturnValue(chain);
      return chain;
    };

    it('không truyền typeId -> filter rỗng, lấy tất cả, sort createdAt desc', async () => {
      const chain = mockFind([]);

      await service.findImages();

      expect(imgAvatarModel.find).toHaveBeenCalledWith({});
      expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('có typeId -> filter đúng theo type', async () => {
      mockFind([]);

      await service.findImages('type-1');

      expect(imgAvatarModel.find).toHaveBeenCalledWith({ type: 'type-1' });
    });
  });

  describe('removeType / removeImage — xoá đơn lẻ, kiểm tra hành vi cascade thực tế', () => {
    it('removeType không tồn tại -> NotFoundException', async () => {
      typeAvatarModel.findByIdAndDelete.mockReturnValue(execResolves(null));

      await expect(service.removeType('khong-ton-tai')).rejects.toThrow(NotFoundException);
    });

    it('removeType xoá type thành công, nhưng KHÔNG cascade xoá các ImgAvatar đang tham chiếu type đó (ghi nhận hành vi hiện tại của code — không có cơ chế cascade nào trong AvatarsService, ảnh có thể trở thành orphan sau khi type bị xoá)', async () => {
      typeAvatarModel.findByIdAndDelete.mockReturnValue(execResolves({ _id: 'type-1' }));

      await service.removeType('type-1');

      expect(typeAvatarModel.findByIdAndDelete).toHaveBeenCalledWith('type-1');
      expect(imgAvatarModel.deleteMany).not.toHaveBeenCalled();
      expect(imgAvatarModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('removeImage xoá ảnh thành công', async () => {
      imgAvatarModel.findByIdAndDelete.mockReturnValue(execResolves({ _id: 'img-1' }));

      await expect(service.removeImage('img-1')).resolves.toBeUndefined();
      expect(imgAvatarModel.findByIdAndDelete).toHaveBeenCalledWith('img-1');
    });

    it('removeImage không tồn tại -> NotFoundException', async () => {
      imgAvatarModel.findByIdAndDelete.mockReturnValue(execResolves(null));

      await expect(service.removeImage('khong-ton-tai')).rejects.toThrow(NotFoundException);
    });
  });
});
