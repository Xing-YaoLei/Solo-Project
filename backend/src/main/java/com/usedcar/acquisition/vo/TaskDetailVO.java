package com.usedcar.acquisition.vo;

import com.usedcar.acquisition.entity.AcquisitionTask;
import com.usedcar.acquisition.entity.FinanceMaterial;
import com.usedcar.acquisition.entity.QuoteHistory;
import com.usedcar.acquisition.entity.StatusLog;
import com.usedcar.acquisition.entity.VehicleArchive;
import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class TaskDetailVO implements Serializable {
    private AcquisitionTask task;
    private VehicleArchive vehicle;
    private List<QuoteHistory> quoteList;
    private List<FinanceMaterial> materialList;
    private List<StatusLog> statusLogList;
    private String assessorName;
    private String salesName;
    private String managerName;
    private String createByName;
}
