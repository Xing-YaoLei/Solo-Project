using System;
using System.Collections.Generic;

namespace PlayFab
{
    public class PlayFabError
    {
        public string ErrorMessage;
        public int HttpCode;
        public string HttpStatus;
        public PlayFabErrorCode Error;
        public Dictionary<string, string[]> ErrorDetails;
        public string RequestId;
        public object CustomData;

        public PlayFabError() { }

        public PlayFabError(string message)
        {
            ErrorMessage = message;
            Error = PlayFabErrorCode.Unknown;
            HttpCode = 0;
        }

        public PlayFabError(PlayFabErrorCode code, string message, int httpCode = 0, string httpStatus = null)
        {
            Error = code;
            ErrorMessage = message;
            HttpCode = httpCode;
            HttpStatus = httpStatus;
        }

        public override string ToString()
        {
            return $"{Error}: {ErrorMessage}";
        }
    }

    public enum PlayFabErrorCode
    {
        Unknown = 1,
        Success = 0,
        InvalidParams = 1000,
        AccountNotFound = 1001,
        AccountBanned = 1002,
        InvalidTitleId = 1003,
        InvalidRequest = 1004,
        NotAuthenticated = 1005,
        ThisAccountHasBeenBanned = 1006,
        NotImplemented = 1007,
        VersionNotFound = 1008,
        BuildNotFound = 1009,
        RegionNotFound = 1010,
        GameBuildDoesNotExist = 1011,
        GameServerDoesNotExist = 1012,
        GameServerAlreadyExists = 1013,
        InvalidPublisherId = 1014,
        UnknownError = 1111,
        DatabaseError = 1123,
        ServiceUnavailable = 1125,
        RateLimitExceeded = 1132,
    }
}
