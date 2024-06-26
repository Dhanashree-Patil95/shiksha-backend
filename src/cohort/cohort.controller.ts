import {
  ApiTags,
  ApiBody,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiBasicAuth,
  ApiConsumes,
  ApiHeader,
} from "@nestjs/swagger";
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  UseInterceptors,
  SerializeOptions,
  Req,
  UploadedFile,
  Res,
  Headers,
  Delete,
  UseGuards,
  ValidationPipe,
  UsePipes,
  Query,
} from "@nestjs/common";
import { CohortSearchDto } from "./dto/cohort-search.dto";
import { Request } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { editFileName, imageFileFilter } from "./utils/file-upload.utils";
import { diskStorage } from "multer";
import { Response, response } from "express";
import { CohortAdapter } from "./cohortadapter";
import { CohortCreateDto } from "./dto/cohort-create.dto";
import { CohortService } from "./cohort.service";
import { JwtAuthGuard } from "src/common/guards/keycloak.guard";
import { QueryParamsDto } from "./dto/query-params.dto";

@ApiTags("Cohort")
@Controller("cohort")
@UseGuards(JwtAuthGuard)
export class CohortController {
  constructor(private readonly cohortService: CohortService,private readonly cohortAdapter:CohortAdapter) {}
  //create cohort
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBasicAuth("access-token")
  @ApiCreatedResponse({ description: "Cohort has been created successfully." })
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: process.env.IMAGEPATH,
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    })
  )
  @ApiBody({ type: CohortCreateDto })
  @ApiForbiddenResponse({ description: "Forbidden" })
  // @UseInterceptors(ClassSerializerInterceptor)
  @ApiHeader({
    name: "tenantid",
  })
  public async createCohort(
    @Headers() headers,
    @Req() request: Request,
    @Body() cohortCreateDto: CohortCreateDto,
    @UploadedFile() image,
    @Res() response: Response
  ) {
    let tenantid = headers["tenantid"];
    const payload = {
      image: image?.filename,
      tenantId: tenantid,
    };
    Object.assign(cohortCreateDto, payload);
    const result = await this.cohortAdapter.buildCohortAdapter().createCohort(
      request,
      cohortCreateDto
    );
    return response.status(result.statusCode).json(result);
  }
  
  @Get("cohortDetails?")
  @ApiBasicAuth("access-token")
  @ApiCreatedResponse({ description: "Cohort details" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  @SerializeOptions({
    strategy: "excludeAll",
  })
  @ApiHeader({
    name: "tenantid",
  })
  public async getCohortDetails(
    @Headers() headers,
    @Query() queryParams: QueryParamsDto,
    @Req() request: Request,
    @Res() response: Response
  ) {
    if(!Object.keys(queryParams).length){
      return response.status(400).json({
        message:"Please enter Query Params"
      })
    }
    queryParams.name = queryParams.name.toLocaleLowerCase();
    let data;
    let tenantId = request.headers['tenantId']
    if (queryParams?.name=== 'user') {
      data=queryParams
      return this.cohortService.getCohortsDetails(data,request,response)
    } else if (queryParams?.name === 'cohort') {
      data=queryParams
      return this.cohortService.getCohortsDetails(data,request,response)
    } else {
      return response.status(400).json({
        message:"Invaid Parameters.",
        data:`Valid format should be name="cohortoruser" and id=value`
      })
    }
  }

  // search
  @Post("/search")
  @ApiBasicAuth("access-token")
  @ApiCreatedResponse({ description: "Cohort list." })
  @ApiBody({ type: CohortSearchDto })
  @ApiForbiddenResponse({ description: "Forbidden" })
  // @UseInterceptors(ClassSerializerInterceptor)
  @UsePipes(ValidationPipe)
  @SerializeOptions({
    strategy: "excludeAll",
  })
  @ApiHeader({
    name: "tenantid",
  })
  public async searchCohort(
    @Headers() headers,
    @Req() request: Request,
    @Body() cohortSearchDto: CohortSearchDto,
    @Res() response: Response
  ) {
    let tenantid = headers["tenantid"];
    const result = await this.cohortService.searchCohort(
      tenantid,
      request,
      cohortSearchDto
    );
    return response.status(result.statusCode).json(result);
  }

  //update
  @Put("/:id")
  @ApiConsumes("multipart/form-data")
  @ApiBasicAuth("access-token")
  @ApiCreatedResponse({ description: "Cohort has been updated successfully." })
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: process.env.IMAGEPATH,
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    })
  )
  @ApiBody({ type: CohortCreateDto })
  @ApiForbiddenResponse({ description: "Forbidden" })
  // @UseInterceptors(ClassSerializerInterceptor)
  public async updateCohort(
    @Param("id") cohortId: string,
    @Req() request: Request,
    @Body() cohortCreateDto: CohortCreateDto,
    @UploadedFile() image,
    @Res() response: Response
  ) {
    const imgresponse = {
      image: image?.filename,
    };
    Object.assign(cohortCreateDto, imgresponse);

    const result = await this.cohortService.updateCohort(
      cohortId,
      request,
      cohortCreateDto
    );
    return response.status(result.statusCode).json(result);
  }

  //delete cohort
  @Delete("/:id")
  @ApiConsumes("multipart/form-data")
  @ApiBasicAuth("access-token")
  @ApiCreatedResponse({ description: "Cohort has been deleted successfully." })
  @ApiBody({ type: CohortCreateDto })
  @ApiForbiddenResponse({ description: "Forbidden" })
  // @UseInterceptors(ClassSerializerInterceptor)
  public async updateCohortStatus(
    @Param("id") cohortId: string,
    @Req() request: Request,
    @Body() cohortCreateDto: CohortCreateDto,
    @UploadedFile() image,
    @Res() response: Response
  ) {
    const imgresponse = {
      image: image?.filename,
    };
    Object.assign(cohortCreateDto, imgresponse);
    const result = await this.cohortService.updateCohortStatus(cohortId);
    return response.status(result.statusCode).json(result);
  }
}
