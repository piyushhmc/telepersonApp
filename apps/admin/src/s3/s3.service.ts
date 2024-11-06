import { Injectable } from '@nestjs/common';
import { Express } from 'express';
import { 
    S3Client, 
    PutObjectCommandOutput,
    PutObjectCommandInput,
    PutObjectCommand
 } from "@aws-sdk/client-s3";
import { ConfigService } from '@nestjs/config';
import{LoggerModule} from'@app/common'

@Injectable()
export class S3Service {
    private region:string;
    private s3:S3Client;
    private logger = new LoggerModule();

    constructor(
        private readonly configService: ConfigService,
    ){
        this.region=this.configService.get<string>("AWS_REGION")||'us-east-2'
        this.s3= new S3Client({
            region:this.region,
            credentials:{
                secretAccessKey:this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
                accessKeyId:this.configService.get<string>('AWS_ACCESS_KEY_ID')
            }
        })
    }

    async uploadFile(file:Express.Multer.File,key:string){
        const bucketName= this.configService.get<string>('AWS_BUCKET_NAME') || "teleperson-vendors"
        const input :PutObjectCommandInput={
            Body:file.buffer,
            Bucket:bucketName,
            Key:key,
            ACL:'public-read'
        };
        try{
            const response:PutObjectCommandOutput = await this.s3.send(
                new PutObjectCommand(input)
            )
            if (response.$metadata.httpStatusCode==200){
                return `https://${bucketName}.s3.${this.region}.amazonaws.com/${key}`
            }else{
                throw new Error('Image not saved to s3')
            }
        }catch(err){
            this.logger ='can not d=same image in s3',err
            throw err;
        }
    }
}
