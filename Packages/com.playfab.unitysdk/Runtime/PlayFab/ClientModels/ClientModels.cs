using System;
using System.Collections.Generic;

namespace PlayFab.ClientModels
{
    [Serializable]
    public class LoginWithCustomIDRequest
    {
        public string CustomId;
        public bool? CreateAccount;
        public string TitleId;
        public string EncryptedRequest;
    }

    [Serializable]
    public class LoginResult
    {
        public string PlayFabId;
        public string SessionTicket;
        public EntityTokenResponse EntityToken;
        public GetPlayerCombinedInfoResultPayload InfoResultPayload;
        public DateTime? LastLoginTime;
        public bool NewlyCreated;
        public PlayerProfileModel ProfileForView;
        public Dictionary<string, string> SettingsForUser;
        public int? TreatmentAssignment;
        public string EntityId;
        public string EntityType;
    }

    [Serializable]
    public class EntityTokenResponse
    {
        public string EntityToken;
        public string EntityId;
        public string EntityType;
        public DateTime? TokenExpiration;
    }

    [Serializable]
    public class GetPlayerCombinedInfoResultPayload
    {
        public PlayerProfileModel AccountInfo;
        public Dictionary<string, UserDataRecord> UserData;
        public int? UserDataVersion;
        public PlayerUserData UserReadOnlyData;
        public int? UserReadOnlyDataVersion;
        public PlayerStatistics UserStatistics;
        public List<CharacterResult> CharacterInventories;
        public List<string> VirtualCurrencyBalances;
        public List<string> VirtualCurrencyRechargeTimes;
    }

    [Serializable]
    public class PlayerProfileModel
    {
        public string PublisherId;
        public string TitleId;
        public string PlayerId;
        public string DisplayName;
        public string Origination;
        public DateTime? Created;
        public PlayerAvatarUrl AvatarUrl;
        public bool? BannedUntil;
        public bool? IsBanned;
        public int? TotalBansCount;
        public List<PlayerStatistic> Statistics;
        public List<string> Tags;
    }

    [Serializable]
    public class PlayerAvatarUrl
    {
        public string ImageUrl;
    }

    [Serializable]
    public class PlayerStatistic
    {
        public string StatisticName;
        public int Value;
        public int Version;
    }

    [Serializable]
    public class UserDataRecord
    {
        public string Value;
        public DateTime? LastUpdated;
        public UserDataPermission? Permission;
    }

    public enum UserDataPermission
    {
        Private,
        Public
    }

    [Serializable]
    public class PlayerUserData
    {
        public Dictionary<string, UserDataRecord> Data;
        public int? DataVersion;
    }

    [Serializable]
    public class PlayerStatistics
    {
        public Dictionary<string, int> Statistics;
    }

    [Serializable]
    public class CharacterResult
    {
        public string CharacterId;
        public string CharacterName;
        public string TypeString;
        public DateTime? LastLogin;
        public string Experience;
        public int? Level;
        public int? CharacterLevel;
        public string PeCurrency;
    }

    [Serializable]
    public class ExecuteCloudScriptRequest
    {
        public string FunctionName;
        public object FunctionParameter;
        public string RevisionSelection;
        public int? SpecificRevision;
        public bool? GeneratePlayStreamEvent;
    }

    [Serializable]
    public class ExecuteCloudScriptResult
    {
        public int? Revision;
        public string FunctionName;
        public string FunctionResult;
        public bool FunctionResultTooLarge;
        public int? APIRequestsIssued;
        public int? HttpRequestsIssued;
        public ExecutionTime? ExecutionTime;
        public string Error;
        public string Logs;
        public int? MemoryConsumed;
        public float? ProcessorTimeSeconds;
        public bool? MemoryLimitExceeded;
        public string Workflow;
        public string WorkflowInstance;
    }

    [Serializable]
    public struct ExecutionTime
    {
        public int Seconds;
        public int Milliseconds;
        public long Ticks;
        public double TotalSeconds;
        public double TotalMilliseconds;
    }

    [Serializable]
    public class GetLeaderboardRequest
    {
        public string StatisticName;
        public int MaxResultsCount;
        public int StartPosition;
        public string Version;
        public bool? ProfileConstraints;
    }

    [Serializable]
    public class GetLeaderboardResult
    {
        public List<PlayerLeaderboardEntry> Leaderboard;
        public string StatisticName;
        public int? Version;
    }

    [Serializable]
    public class PlayerLeaderboardEntry
    {
        public string PlayFabId;
        public int Position;
        public int StatValue;
        public string DisplayName;
        public PlayerProfileModel Profile;
    }

    [Serializable]
    public class GetTitleDataRequest
    {
        public List<string> Keys;
        public string PlayFabId;
    }

    [Serializable]
    public class GetTitleDataResult
    {
        public Dictionary<string, string> Data;
    }

    [Serializable]
    public class GetUserDataRequest
    {
        public string PlayFabId;
        public List<string> Keys;
        public UserDataPermission? IfChangedFromDataVersion;
        public int? IfChangedFromDataVersionInt;
    }

    [Serializable]
    public class GetUserDataResult
    {
        public Dictionary<string, UserDataRecord> Data;
        public int? DataVersion;
        public string PlayFabId;
    }

    [Serializable]
    public class UpdateUserDataRequest
    {
        public string PlayFabId;
        public Dictionary<string, string> Data;
        public List<string> KeysToRemove;
        public UserDataPermission? Permission;
    }

    [Serializable]
    public class UpdateUserDataResult
    {
        public int? DataVersion;
    }

    [Serializable]
    public class RegisterPlayFabUserRequest
    {
        public string Username;
        public string Email;
        public string Password;
        public string TitleId;
        public string DisplayName;
        public bool? RequireBothUsernameAndEmail;
    }

    [Serializable]
    public class RegisterPlayFabUserResult
    {
        public string PlayFabId;
        public string Username;
        public string EntityToken;
        public string EntityId;
        public string EntityType;
    }

    [Serializable]
    public class SendAccountRecoveryEmailRequest
    {
        public string Email;
        public string TitleId;
    }

    [Serializable]
    public class SendAccountRecoveryEmailResult
    {
    }

    [Serializable]
    public class GetAccountInfoRequest
    {
        public string PlayFabId;
        public string Username;
        public string Email;
        public string TitleId;
    }

    [Serializable]
    public class GetAccountInfoResult
    {
        public UserAccountInfo Info;
    }

    [Serializable]
    public class UserAccountInfo
    {
        public UserPrivateAccountInfo PrivateInfo;
        public UserPublicAccountInfo PublicInfo;
        public List<LinkedPlatformAccount> LinkedAccounts;
    }

    [Serializable]
    public class UserPrivateAccountInfo
    {
        public string Email;
    }

    [Serializable]
    public class UserPublicAccountInfo
    {
        public string PlayFabId;
        public DateTime? Created;
        public string Username;
        public string TitleDisplayName;
        public string AvatarUrl;
    }

    [Serializable]
    public class LinkedPlatformAccount
    {
        public string Platform;
        public string PlatformUserId;
        public string Username;
    }
}
