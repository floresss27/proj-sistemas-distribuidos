// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var redesocial_pb = require('./redesocial_pb.js');

function serialize_socialnetwork_Ack(arg) {
  if (!(arg instanceof redesocial_pb.Ack)) {
    throw new Error('Expected argument of type socialnetwork.Ack');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_Ack(buffer_arg) {
  return redesocial_pb.Ack.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_socialnetwork_ClockSyncRequest(arg) {
  if (!(arg instanceof redesocial_pb.ClockSyncRequest)) {
    throw new Error('Expected argument of type socialnetwork.ClockSyncRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_ClockSyncRequest(buffer_arg) {
  return redesocial_pb.ClockSyncRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_socialnetwork_ClockSyncResponse(arg) {
  if (!(arg instanceof redesocial_pb.ClockSyncResponse)) {
    throw new Error('Expected argument of type socialnetwork.ClockSyncResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_ClockSyncResponse(buffer_arg) {
  return redesocial_pb.ClockSyncResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_socialnetwork_DirectMessage(arg) {
  if (!(arg instanceof redesocial_pb.DirectMessage)) {
    throw new Error('Expected argument of type socialnetwork.DirectMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_DirectMessage(buffer_arg) {
  return redesocial_pb.DirectMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_socialnetwork_FollowRequest(arg) {
  if (!(arg instanceof redesocial_pb.FollowRequest)) {
    throw new Error('Expected argument of type socialnetwork.FollowRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_FollowRequest(buffer_arg) {
  return redesocial_pb.FollowRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_socialnetwork_Notification(arg) {
  if (!(arg instanceof redesocial_pb.Notification)) {
    throw new Error('Expected argument of type socialnetwork.Notification');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_Notification(buffer_arg) {
  return redesocial_pb.Notification.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_socialnetwork_NotificationRequest(arg) {
  if (!(arg instanceof redesocial_pb.NotificationRequest)) {
    throw new Error('Expected argument of type socialnetwork.NotificationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_NotificationRequest(buffer_arg) {
  return redesocial_pb.NotificationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_socialnetwork_Post(arg) {
  if (!(arg instanceof redesocial_pb.Post)) {
    throw new Error('Expected argument of type socialnetwork.Post');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_socialnetwork_Post(buffer_arg) {
  return redesocial_pb.Post.deserializeBinary(new Uint8Array(buffer_arg));
}


var SocialNetworkService = exports.SocialNetworkService = {
  // Funcionalidades principais
createPost: {
    path: '/socialnetwork.SocialNetwork/CreatePost',
    requestStream: false,
    responseStream: false,
    requestType: redesocial_pb.Post,
    responseType: redesocial_pb.Ack,
    requestSerialize: serialize_socialnetwork_Post,
    requestDeserialize: deserialize_socialnetwork_Post,
    responseSerialize: serialize_socialnetwork_Ack,
    responseDeserialize: deserialize_socialnetwork_Ack,
  },
  sendDirectMessage: {
    path: '/socialnetwork.SocialNetwork/SendDirectMessage',
    requestStream: false,
    responseStream: false,
    requestType: redesocial_pb.DirectMessage,
    responseType: redesocial_pb.Ack,
    requestSerialize: serialize_socialnetwork_DirectMessage,
    requestDeserialize: deserialize_socialnetwork_DirectMessage,
    responseSerialize: serialize_socialnetwork_Ack,
    responseDeserialize: deserialize_socialnetwork_Ack,
  },
  connectUsers: {
    path: '/socialnetwork.SocialNetwork/ConnectUsers',
    requestStream: false,
    responseStream: false,
    requestType: redesocial_pb.FollowRequest,
    responseType: redesocial_pb.Ack,
    requestSerialize: serialize_socialnetwork_FollowRequest,
    requestDeserialize: deserialize_socialnetwork_FollowRequest,
    responseSerialize: serialize_socialnetwork_Ack,
    responseDeserialize: deserialize_socialnetwork_Ack,
  },
  subscribeToUpdates: {
    path: '/socialnetwork.SocialNetwork/SubscribeToUpdates',
    requestStream: false,
    responseStream: true,
    requestType: redesocial_pb.NotificationRequest,
    responseType: redesocial_pb.Notification,
    requestSerialize: serialize_socialnetwork_NotificationRequest,
    requestDeserialize: deserialize_socialnetwork_NotificationRequest,
    responseSerialize: serialize_socialnetwork_Notification,
    responseDeserialize: deserialize_socialnetwork_Notification,
  },
  syncTime: {
    path: '/socialnetwork.SocialNetwork/SyncTime',
    requestStream: false,
    responseStream: false,
    requestType: redesocial_pb.ClockSyncRequest,
    responseType: redesocial_pb.ClockSyncResponse,
    requestSerialize: serialize_socialnetwork_ClockSyncRequest,
    requestDeserialize: deserialize_socialnetwork_ClockSyncRequest,
    responseSerialize: serialize_socialnetwork_ClockSyncResponse,
    responseDeserialize: deserialize_socialnetwork_ClockSyncResponse,
  },
  // Replicação entre servidores
replicatePost: {
    path: '/socialnetwork.SocialNetwork/ReplicatePost',
    requestStream: false,
    responseStream: false,
    requestType: redesocial_pb.Post,
    responseType: redesocial_pb.Ack,
    requestSerialize: serialize_socialnetwork_Post,
    requestDeserialize: deserialize_socialnetwork_Post,
    responseSerialize: serialize_socialnetwork_Ack,
    responseDeserialize: deserialize_socialnetwork_Ack,
  },
  replicateDirectMessage: {
    path: '/socialnetwork.SocialNetwork/ReplicateDirectMessage',
    requestStream: false,
    responseStream: false,
    requestType: redesocial_pb.DirectMessage,
    responseType: redesocial_pb.Ack,
    requestSerialize: serialize_socialnetwork_DirectMessage,
    requestDeserialize: deserialize_socialnetwork_DirectMessage,
    responseSerialize: serialize_socialnetwork_Ack,
    responseDeserialize: deserialize_socialnetwork_Ack,
  },
  replicateFollow: {
    path: '/socialnetwork.SocialNetwork/ReplicateFollow',
    requestStream: false,
    responseStream: false,
    requestType: redesocial_pb.FollowRequest,
    responseType: redesocial_pb.Ack,
    requestSerialize: serialize_socialnetwork_FollowRequest,
    requestDeserialize: deserialize_socialnetwork_FollowRequest,
    responseSerialize: serialize_socialnetwork_Ack,
    responseDeserialize: deserialize_socialnetwork_Ack,
  },
};

exports.SocialNetworkClient = grpc.makeGenericClientConstructor(SocialNetworkService, 'SocialNetwork');
