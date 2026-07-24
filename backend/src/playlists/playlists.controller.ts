import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddFilmToPlaylistDto } from './dto/add-film-to-playlist.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistsService } from './playlists.service';

@ApiBearerAuth()
@ApiTags('playlists')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(userId, dto);
  }

  @Get()
  findMine(@CurrentUser('userId') userId: string) {
    return this.playlistsService.findMine(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.playlistsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.playlistsService.remove(userId, id);
  }

  @Post(':id/films')
  addFilm(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: AddFilmToPlaylistDto,
  ) {
    return this.playlistsService.addFilm(userId, id, dto.filmId);
  }

  @Delete(':id/films/:filmId')
  removeFilm(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('filmId') filmId: string,
  ) {
    return this.playlistsService.removeFilm(userId, id, filmId);
  }
}
