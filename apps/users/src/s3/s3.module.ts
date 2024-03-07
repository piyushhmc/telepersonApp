import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import{LoggerModule} from'@app/common'

@Module({
  imports:[LoggerModule],
  providers: [S3Service],
  exports:[S3Service],
})
export class S3Module {}
