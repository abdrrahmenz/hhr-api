import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';

@ApiTags('Admin - Organizations')
@Controller('admin/organizations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class OrganizationsController {
    constructor(private organizationsService: OrganizationsService) { }

    @Get()
    @ApiOperation({ summary: 'List all B2B organizations' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAll(
        @Query('isActive') isActive?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.organizationsService.findAll(
            { isActive: isActive ? isActive === 'true' : undefined },
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get organization statistics' })
    async getStats() {
        return this.organizationsService.getOrganizationStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get organization by ID' })
    async findOne(@Param('id') id: string) {
        return this.organizationsService.findOne(id);
    }

    @Get(':id/users')
    @ApiOperation({ summary: 'Get users in organization' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getOrganizationUsers(
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.organizationsService.getOrganizationUsers(
            id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Post()
    @ApiOperation({ summary: 'Create new organization' })
    async create(@Body() dto: CreateOrganizationDto) {
        return this.organizationsService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update organization' })
    async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
        return this.organizationsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deactivate organization' })
    async delete(@Param('id') id: string) {
        return this.organizationsService.delete(id);
    }
}
