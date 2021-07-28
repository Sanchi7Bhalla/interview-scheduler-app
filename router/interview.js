const express = require('express');
const router = express.Router();
const Interview = require("../modals/interview")
const moment = require("moment");
const { request } = require('express');

/*
    @usage : to create a interview
    @url : /api/interview/create
    @fields : start , end , [{participantId},{participantId}.....]
    @method : POST
    @access : PUBLIC

 */

router.post('/create',async (request,response)=>{
    try {
        const {start,end,participants} = request.body
        let gmtStart = new Date(start)
        let gmtEnd = new Date(end)

        if(participants.length < 2){
            return response.status(201).json({
                message:"please select atleast two participants"
            })
        }
        const interviews = await Interview.find({})
        const clashedInterviews = [];
        for (const interview of interviews) {
            if(gmtStart < interview.end && gmtStart > interview.start){
                clashedInterviews.push(interview)
            } else if(gmtEnd < interview.end && gmtEnd > interview.start) {
                clashedInterviews.push(interview)
            }
        }
        for (const clashedInterview of clashedInterviews) {
            for (const clashedInterviewParticipant of clashedInterview.participants) {
                for (const participantElement of participants) {
                    if(participantElement._id == clashedInterviewParticipant){
                        return response.status(202).json({
                            message:`time clash ! please select other time slot`
                        })
                    }
                }
            }
        }
        let interview = new Interview({start:gmtStart,end:gmtEnd,participants})
        const result = interview.save()
        console.log("-------------------------------------")
        response.status(200).json({
            message : 'interview created',
            createdInterview:result
        });

    }catch (error)  {
        console.error(error);
        response.status(500).json({errors : [{message : error.message}]});
    }
})


// get all interviews

router.get('/',async (request,response)=>{
    try {
        const interviews = await Interview.find().populate({path:'participants',populate: { path: 'participant' }})
        response.status(200).json({
            msg : 'get all participant success',
            interviews:interviews
        });
    }catch (error) {
        console.error(error);
        response.status(500).json({errors : [{msg : error.message}]});
    }
})

/*
    @usage : Delete A interview with InterviewId
    @url : /api/interview/:interview_id
    @fields : no-fields
    @method : DELETE
    @access : PUBLIC
 */
    router.delete('/:interview_id' , async  (request , response) => {
        try {
            let interviewId = request.params.interview_id;
            console.log(interviewId);
            // check if interview is exists
            let interview = await Interview.findById(interviewId);
            if(!interviewId){
                return response.status(400).json({errors : [{msg : 'No interviewId Found'}]});
            }
            interview = await Interview.findByIdAndRemove(interviewId);
            response.status(200).json({
                msg : 'interview is Deleted',
                interview : interview
            });
        }
        catch (error) {
            console.error(error);
            response.status(500).json({errors : [{msg : error.message}]});
        }
    });

/*
    @usage : Update interview
    @url : /api/interview/:interview_id
    @fields : start, end, participants
    @method : PUT
    @access : PUBLIC
 */
    router.put('/:interview_id', async(request , response) => {
        try {
            let {start, end, participants} = request.body;
           
            // check if interview exists
            let interviewId = request.params.interview_id;
            if(!interviewId){
                return response.status(401).json({errors : [{msg : 'No interview Found'}]});
            }

            let gmtStart = new Date(start)
            let gmtEnd = new Date(end)
            
            if(participants.length < 2){
                return response.status(201).json({
                    message:"please select atleast two participants"
                })
            }

            const interviews = await Interview.find({})
            const clashedInterviews = [];
            for (const interview of interviews) {
                if(interview._id==interviewId) { continue }
                if(gmtStart < interview.end && gmtStart > interview.start){
                    clashedInterviews.push(interview)
                } else if(gmtEnd < interview.end && gmtEnd > interview.start) {
                    clashedInterviews.push(interview)
                }
            }
            for (const clashedInterview of clashedInterviews) {
                for (const clashedInterviewParticipant of clashedInterview.participants) {
                    for (const participantElement of participants) {
                        if(participantElement._id == clashedInterviewParticipant){
                            return response.status(202).json({
                                message:`time clash ! please select other time slot`
                            })
                        }
                    }
                }
            }
    
            let interviewObj = {};
            interviewObj.start=gmtStart;
            interviewObj.end=gmtEnd;
            for(participant of participants){
                interviewObj.participants.unshift(participant);
            }
            
            // update to db
            interview = await Interview.findOneAndUpdate({interviewId} , {
                $set : interviewObj
            } , {new : true});
    
            response.status(200).json({
                message : 'interview is Updated Successfully',
                interview : interview
            });
        }
        catch (error) {
            console.error(error);
            response.status(500).json({errors : [{msg : error.message}]});
        }
    });
    

module.exports = router;

