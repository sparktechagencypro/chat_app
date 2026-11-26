import prisma from "@app/shared/prisma.js"

export const getMyChatList = async(userId:string) =>{

const chats = await prisma.chats.findMany({
    where:{
        participant:{
            some:{
                userId:userId
            }
        }
    },
    include:{
        participant:true,
        message:true
        

    }
})

return chats


}