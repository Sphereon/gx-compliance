// Replace all datasets with datasets from 2210
let checks = 
[
    { 
        name:"testParticipantRulesOK" ,
        url :  'https://compliance.lab.gaia-x.eu/api/participant/verify/raw' ,  
        testfile : './datas/2210/participant-ok.json',
        testResult : function (body) {  return body.conforms == true },
        type: "post"
    },
    { 
        name:"testParticipantRulesKO-RegistrationNumber" ,
        url :  'https://compliance.lab.gaia-x.eu/api/participant/verify/raw' ,  
        testfile : './datas/2210/participant-ko-registrationNumber.json',
        testResult : function (body) {  return body.message.conforms == false },
        type: "post"
    },
    ,
    { 
        name:"testParticipantRulesKO-CheckDID" ,
        url :  'https://compliance.lab.gaia-x.eu/api/participant/verify/raw' ,  
        testfile : './datas/2210/participant-ko-checkDid.json',
        testResult : function (body) {  return body.message.conforms == false },
        type: "post"
    },
    {
        name:"testServiceOfferingRulesOK" ,
        url :  'https://compliance.lab.gaia-x.eu/api/service-offering/verify/raw' ,  
        testfile : './datas/2210/serviceOffering-ok.json',
        testResult : function (body) {  
            return body.conforms == true },
        type: "post"
    },
    {
        name:"testServiceOfferingRulesKO-CheckDid" ,
        url :  'https://compliance.lab.gaia-x.eu/api/service-offering/verify/raw' ,  
        testfile : './datas/2210/serviceOffering-ko-CheckDid.json',
        testResult : function (body) {  return body.statusCode == 409 },
        type: "post"
    },
    {
        name:"testServiceOfferingRulesKO-HttpCode" ,
        url :  'https://compliance.lab.gaia-x.eu/api/service-offering/verify/raw' ,  
        testfile : './datas/2210/serviceOffering-ko-HttpCode.json',
        testResult : function (body) {  return body.message == "Participant SD not found" },
        type: "post"
    }, 
    { 
        name:"testParticipantRulesOKUniform" ,
        url :  'https://compliance.lab.gaia-x.eu/api/verify' ,  
        testfile : './datas/2210/participant-ok.json',
        testResult : function (body) {  return body.conforms == true },
        type: "post"
    },
    {
        name:"testServiceOfferingRulesOKUniform" ,
        url :  'https://compliance.lab.gaia-x.eu/api/verify' ,  
        testfile : './datas/2210/serviceOffering-ok.json',
        testResult : function (body) {  return body.conforms == true },
        type: "post"
    },
    {
        name:"testServiceOfferingRulesKO-HttpCodeUniform" ,
        url :  'https://compliance.lab.gaia-x.eu/api/verify' ,  
        testfile : './datas/2210/serviceOffering-ko-HttpCode.json',
        testResult : function (body) {  return body.message == "Participant SD not found" },
        type: "post"
    }, 
    {
        name:"testServiceOfferingRulesKO-CheckDidUniform" ,
        url :  'https://compliance.lab.gaia-x.eu/api/verify' ,  
        testfile : './datas/2210/serviceOffering-ko-CheckDid.json',
        testResult : function (body) {  return body.statusCode == 409 },
        type: "post"
    },
    { 
        name:"testParticipantRulesKO-CheckDIDUniform" ,
        url :  'https://compliance.lab.gaia-x.eu/api/verify' ,  
        testfile : './datas/2210/participant-ko-checkDid.json',
        testResult : function (body) {  return body.message.conforms == false },
        type: "post"
    },
    { 
        name:"testVC-Issuance-Participant-OK" ,
        url :  'https://compliance.lab.gaia-x.eu/api/vc-issuance' ,  
        testfile : './datas/2210/participant-ok-sd.json',
        testResult : function (body) {  
            return !body.complianceCredential  == false },
        type: "post"
    },
    { 
        name:"testVC-Issuance-Participant-KO-did" ,
        url :  'https://compliance.lab.gaia-x.eu/api/vc-issuance' ,  
        testfile : './datas/2210/participant-ko-did-sd.json',
        testResult : function (body) {  
            return body.message.conforms == false},
        type: "post"
    },
    { 
        name:"testVC-Issuance-Service-offering-OK" ,
        url :  'https://compliance.lab.gaia-x.eu/api/vc-issuance' ,  
        testfile : './datas/2210/service-offering-ok-sd.json',
        testResult : function (body) {  return !body.complianceCredential  == false },
        type: "post"
    },
    { 
        name:"testVC-Issuance-Service-offering-KO-http" ,
        url :  'https://compliance.lab.gaia-x.eu/api/vc-issuance' ,  
        testfile : './datas/2210/service-offering-ko-http-sd.json',
        testResult : function (body) {  
            return body.message.conforms == false},
        type: "post"
    },
];

export default checks;