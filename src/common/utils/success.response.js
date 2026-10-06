export const successResponse = ({res,message="Done" , data=undefined , status=200}={})=>{
    return res.status(status).json({message,status,data})
}