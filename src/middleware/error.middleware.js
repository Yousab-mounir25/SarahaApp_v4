export const globalErrorHandling = (error ,req,res,next)=>{
    return res.status(error.cause?.status ?? 500).json({
        error_message:error.message || 'server error',
        error,
        issues:error.cause?.issues,
        stack:error.stack
    })
}