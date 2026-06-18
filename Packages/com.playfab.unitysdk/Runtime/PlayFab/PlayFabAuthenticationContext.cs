using System;
using System.Collections.Generic;

namespace PlayFab
{
    public class PlayFabAuthenticationContext
    {
        public string PlayFabId;
        public string EntityId;
        public string EntityType;
        public string EntityToken;
        public string SessionTicket;

        public PlayFabAuthenticationContext() { }

        public PlayFabAuthenticationContext(string playFabId, string sessionTicket = null)
        {
            PlayFabId = playFabId;
            SessionTicket = sessionTicket;
        }
    }
}
