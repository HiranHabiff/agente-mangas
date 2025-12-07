import { Controller, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { mangaContract } from '../../contracts/manga.contract';
import { MangaService } from './manga.service';

@Controller()
@ApiTags('mangas')
export class MangaController {
  constructor(private readonly mangaService: MangaService) {}

  @TsRestHandler(mangaContract)
  async handler() {
    return tsRestHandler(mangaContract, {
      getAll: async ({ query }) => {
        const result = await this.mangaService.findAll(query);
        return {
          status: 200 as const,
          body: result,
        };
      },

      getById: async ({ params }) => {
        try {
          const manga = await this.mangaService.findById(params.id);
          return {
            status: 200 as const,
            body: manga,
          };
        } catch (error: any) {
          return {
            status: 404 as const,
            body: { message: error.message },
          };
        }
      },

      create: async ({ body }) => {
        try {
          const manga = await this.mangaService.create(body);
          return {
            status: 201 as const,
            body: manga,
          };
        } catch (error: any) {
          return {
            status: 400 as const,
            body: {
              message: error.message,
              errors: error.errors,
            },
          };
        }
      },

      update: async ({ params, body }) => {
        try {
          const manga = await this.mangaService.update(params.id, body);
          return {
            status: 200 as const,
            body: manga,
          };
        } catch (error: any) {
          if (error.message.includes('not found')) {
            return {
              status: 404 as const,
              body: { message: error.message },
            };
          }
          return {
            status: 400 as const,
            body: {
              message: error.message,
              errors: error.errors,
            },
          };
        }
      },

      delete: async ({ params }) => {
        try {
          await this.mangaService.delete(params.id);
          return {
            status: 204 as const,
            body: undefined,
          };
        } catch (error: any) {
          return {
            status: 404 as const,
            body: { message: error.message },
          };
        }
      },

      restore: async ({ params }) => {
        try {
          const manga = await this.mangaService.restore(params.id);
          return {
            status: 200 as const,
            body: manga,
          };
        } catch (error: any) {
          return {
            status: 404 as const,
            body: { message: error.message },
          };
        }
      },
    });
  }
}
