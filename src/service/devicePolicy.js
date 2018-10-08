/*
 * Filename: /home/jackyang/factory/src/service/devicePolicy.js
 * Path: /home/jackyang/factory
 * Created Date: Monday, October 8th 2018, 1:52:08 pm
 * Author: JackYang
 * 
 * Copyright (c) 2018 Wisnuc Inc
 */

/* eslint-disable */
module.exports = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iot:Connect"
      ],
      Resource: [
        "arn:aws-cn:iot:cn-north-1:661732900416:client/${iot:ClientId}"
      ]
    },
    {
      Effect: "Allow",
      Action: [
        "iot:Publish"
      ],
      Resource: [
        "arn:aws-cn:iot:cn-north-1:661732900416:topic/device/${iot:ClientId}/*"
      ]
    },
    {
      Effect: "Allow",
      Action: [
        "iot:Subscribe"
      ],
      Resource: [
        "arn:aws-cn:iot:cn-north-1:661732900416:topicfilter/cloud/${iot:ClientId}/*"
      ]
    },
    {
      Effect: "Allow",
      Action: [
        "iot:Receive"
      ],
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: [
        "iot:UpdateThing",
        "iot:ListThings"
      ],
      Resource: "*"
    }
  ]
}