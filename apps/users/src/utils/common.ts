

export class Common {

    async makeSuccessResponse(data:any,status:number ){
        const res = {
            status:status,
            data:data
        }
        return res
    }
}