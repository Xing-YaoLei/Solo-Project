using System;
using System.Collections.Generic;
using UnityEngine;

namespace UsedCarGame.Data
{
    public enum QuestionType
    {
        PriceHistory,
        FinancialDocument,
        VehicleRecord,
        InspectionReport
    }

    public enum DecisionAction
    {
        Approve,
        Reject,
        NeedMoreInfo
    }

    [Serializable]
    public class VehicleInfo
    {
        public string brand;
        public string model;
        public int year;
        public int mileage;
        public string color;
        public string plateNumber;
        public string vin;
    }

    [Serializable]
    public class PriceHistoryEntry
    {
        public DateTime date;
        public float price;
        public string source;
        public string region;
    }

    [Serializable]
    public class FinancialDocument
    {
        public string documentType;
        public string ownerName;
        public bool hasLoan;
        public float loanBalance;
        public bool hasAccidentRecord;
        public int accidentCount;
        public bool isMortgaged;
        public List<string> flags;
    }

    [Serializable]
    public class VehicleRecord
    {
        public int ownershipCount;
        public int transferCount;
        public DateTime firstRegisterDate;
        public DateTime lastTransferDate;
        public bool hasInsurance;
        public DateTime insuranceExpiry;
        public List<string> violationRecords;
    }

    [Serializable]
    public class InspectionItem
    {
        public string category;
        public string itemName;
        public string condition;
        public string description;
        public float estimatedRepairCost;
    }

    [Serializable]
    public class InspectionReport
    {
        public string inspectorName;
        public DateTime inspectionDate;
        public float overallScore;
        public List<InspectionItem> items;
        public List<string> majorIssues;
        public string summary;
    }

    [Serializable]
    public class QuestionData
    {
        public string questionId;
        public QuestionType type;
        public float timeLimit;
        public VehicleInfo vehicle;
        public float askedPrice;
        public float estimatedMarketPrice;
        public float minAcceptableMargin;

        public List<PriceHistoryEntry> priceHistory;
        public FinancialDocument financialDoc;
        public VehicleRecord vehicleRecord;
        public InspectionReport inspectionReport;

        public DecisionAction correctDecision;
        public string explanation;
    }
}
