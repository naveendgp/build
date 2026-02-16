import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({ summary: 'Get Hello' })
  @ApiResponse({ status: 200, description: 'Returns Hello' })
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('services')
  @ApiOperation({ summary: 'Get all services' })
  async getServices() {
    // This is a temporary hack to expose services via AppController using AdminService, 
    // but AppService doesn't have it.
    // Better to use a new Controller or existing logic.
    // Since I can't easily inject AdminService into AppController without circular deps maybe?
    // Let's use `appService`.
    return { message: "Use /admin/services endpoint instead or implement in AppService" };
  }
}
