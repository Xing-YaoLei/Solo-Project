package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.domain.VehicleArchive;
import com.usedcar.scheduling.dto.DashboardDTO;
import com.usedcar.scheduling.dto.ReportDTO;
import com.usedcar.scheduling.enums.TodoStatus;
import com.usedcar.scheduling.enums.UserRole;
import com.usedcar.scheduling.enums.VehicleStatus;
import com.usedcar.scheduling.repository.TodoItemRepository;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.repository.VehicleArchiveRepository;
import com.usedcar.scheduling.repository.VehicleRepository;
import com.usedcar.scheduling.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final VehicleRepository vehicleRepository;
    private final VehicleArchiveRepository vehicleArchiveRepository;
    private final TodoItemRepository todoItemRepository;
    private final UserRepository userRepository;

    @Override
    public DashboardDTO getDashboardData(Long storeId) {
        DashboardDTO dto = new DashboardDTO();

        List<Vehicle> allVehicles = storeId != null
                ? vehicleRepository.findByStoreId(storeId)
                : vehicleRepository.findAll();

        dto.setTotalVehicles((long) allVehicles.size());
        dto.setListedVehicles(allVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.LISTED).count());
        dto.setPreparingVehicles(allVehicles.stream()
                .filter(v -> v.getStatus() == VehicleStatus.PREPARING || v.getStatus() == VehicleStatus.PENDING_PREPARATION)
                .count());
        dto.setSoldVehicles(allVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.SOLD).count());

        long pendingTodos = todoItemRepository.findByStatus(TodoStatus.PENDING).size();
        long overdueTodos = todoItemRepository.findOverdueItems(LocalDate.now(),
                List.of(TodoStatus.PENDING, TodoStatus.PROCESSING)).size();
        dto.setPendingTodos(pendingTodos);
        dto.setOverdueTodos(overdueTodos);

        long todayListings = allVehicles.stream()
                .filter(v -> v.getListingDate() != null && v.getListingDate().equals(LocalDate.now()))
                .count();
        dto.setTodayListings(todayListings);

        long total = allVehicles.size();
        long sold = allVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.SOLD).count();
        BigDecimal turnoverRate = total > 0
                ? BigDecimal.valueOf(sold).divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setInventoryTurnoverRate(turnoverRate);

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<VehicleArchive> recentActivities = vehicleArchiveRepository
                .findByCreatedAtBetween(weekAgo, LocalDateTime.now(), org.springframework.data.domain.PageRequest.of(0, 10))
                .getContent();

        dto.setRecentActivities(recentActivities);

        return dto;
    }

    @Override
    public ReportDTO getInventoryReport(LocalDate startDate, LocalDate endDate, Long storeId) {
        ReportDTO dto = new ReportDTO();
        dto.setPeriod(startDate + " ~ " + endDate);

        List<Vehicle> vehicles = storeId != null
                ? vehicleRepository.findByStoreId(storeId)
                : vehicleRepository.findAll();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        dto.setTotalVehicles((long) vehicles.size());
        long soldCount = vehicles.stream()
                .filter(v -> v.getStatus() == VehicleStatus.SOLD)
                .count();
        dto.setSoldVehicles(soldCount);

        double avgDays = vehicles.stream()
                .filter(v -> v.getPurchaseDate() != null && v.getListingDate() != null)
                .mapToLong(v -> ChronoUnit.DAYS.between(v.getPurchaseDate(), v.getListingDate()))
                .average()
                .orElse(0.0);
        dto.setAvgDaysToSell(BigDecimal.valueOf(avgDays).setScale(2, RoundingMode.HALF_UP));

        BigDecimal turnoverRate = vehicles.size() > 0
                ? BigDecimal.valueOf(soldCount).divide(BigDecimal.valueOf(vehicles.size()), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setInventoryTurnoverRate(turnoverRate);

        BigDecimal revenue = vehicles.stream()
                .filter(v -> v.getStatus() == VehicleStatus.SOLD && v.getListingPrice() != null)
                .map(Vehicle::getListingPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setRevenue(revenue);

        Map<String, ReportDTO.StoreReport> byStore = new LinkedHashMap<>();
        Map<Long, List<Vehicle>> storeGroups = new LinkedHashMap<>();
        for (Vehicle v : vehicles) {
            Long sid = v.getStore() != null ? v.getStore().getId() : 0L;
            storeGroups.computeIfAbsent(sid, k -> new ArrayList<>()).add(v);
        }
        for (Map.Entry<Long, List<Vehicle>> entry : storeGroups.entrySet()) {
            List<Vehicle> sv = entry.getValue();
            String storeName = sv.get(0).getStore() != null ? sv.get(0).getStore().getName() : "未知门店";
            ReportDTO.StoreReport sr = new ReportDTO.StoreReport();
            sr.setStoreName(storeName);
            sr.setVehicleCount((long) sv.size());
            long storeSold = sv.stream().filter(v -> v.getStatus() == VehicleStatus.SOLD).count();
            sr.setSoldCount(storeSold);
            sr.setTurnoverRate(sv.size() > 0
                    ? BigDecimal.valueOf(storeSold).divide(BigDecimal.valueOf(sv.size()), 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
            byStore.put(storeName, sr);
        }
        dto.setByStore(byStore);

        return dto;
    }

    @Override
    public ReportDTO getPersonReport(LocalDate startDate, LocalDate endDate, Long personId) {
        ReportDTO dto = new ReportDTO();
        dto.setPeriod(startDate + " ~ " + endDate);

        List<Vehicle> allVehicles = vehicleRepository.findAll();
        List<User> users = personId != null
                ? userRepository.findById(personId).map(List::of).orElse(List.of())
                : userRepository.findAll();

        dto.setTotalVehicles((long) allVehicles.size());
        long soldCount = allVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.SOLD).count();
        dto.setSoldVehicles(soldCount);

        Map<String, ReportDTO.PersonReport> byPerson = new LinkedHashMap<>();
        for (User user : users) {
            ReportDTO.PersonReport pr = new ReportDTO.PersonReport();
            pr.setPersonName(user.getRealName());
            pr.setRoleName(user.getRole().name());

            long vehicleCount;
            if (user.getRole() == UserRole.ASSESSOR) {
                vehicleCount = allVehicles.stream().filter(v -> v.getAssessor() != null && v.getAssessor().getId().equals(user.getId())).count();
            } else {
                vehicleCount = allVehicles.stream().filter(v -> v.getSales() != null && v.getSales().getId().equals(user.getId())).count();
            }
            pr.setVehicleCount(vehicleCount);

            long completedCount = allVehicles.stream()
                    .filter(v -> v.getStatus() == VehicleStatus.SOLD)
                    .filter(v -> (v.getSales() != null && v.getSales().getId().equals(user.getId()))
                            || (v.getAssessor() != null && v.getAssessor().getId().equals(user.getId())))
                    .count();
            pr.setCompletedCount(completedCount);

            long overdueCount = todoItemRepository.findByAssigneeIdAndStatus(user.getId(), TodoStatus.PENDING)
                    .stream()
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()))
                    .count();
            pr.setOverdueCount(overdueCount);

            byPerson.put(user.getRealName(), pr);
        }
        dto.setByPerson(byPerson);

        return dto;
    }

    @Override
    public ReportDTO getDateDrilldownReport(LocalDate startDate, LocalDate endDate) {
        ReportDTO dto = new ReportDTO();
        dto.setPeriod(startDate + " ~ " + endDate);

        List<Vehicle> allVehicles = vehicleRepository.findAll();
        dto.setTotalVehicles((long) allVehicles.size());

        long soldInPeriod = allVehicles.stream()
                .filter(v -> v.getStatus() == VehicleStatus.SOLD)
                .filter(v -> v.getListingDate() != null
                        && !v.getListingDate().isBefore(startDate)
                        && !v.getListingDate().isAfter(endDate))
                .count();
        dto.setSoldVehicles(soldInPeriod);

        double avgDays = allVehicles.stream()
                .filter(v -> v.getPurchaseDate() != null && v.getListingDate() != null)
                .filter(v -> !v.getListingDate().isBefore(startDate) && !v.getListingDate().isAfter(endDate))
                .mapToLong(v -> ChronoUnit.DAYS.between(v.getPurchaseDate(), v.getListingDate()))
                .average()
                .orElse(0.0);
        dto.setAvgDaysToSell(BigDecimal.valueOf(avgDays).setScale(2, RoundingMode.HALF_UP));

        long totalInPeriod = allVehicles.stream()
                .filter(v -> v.getListingDate() != null
                        && !v.getListingDate().isBefore(startDate)
                        && !v.getListingDate().isAfter(endDate))
                .count();
        BigDecimal turnoverRate = totalInPeriod > 0
                ? BigDecimal.valueOf(soldInPeriod).divide(BigDecimal.valueOf(totalInPeriod), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setInventoryTurnoverRate(turnoverRate);

        BigDecimal revenue = allVehicles.stream()
                .filter(v -> v.getStatus() == VehicleStatus.SOLD && v.getListingPrice() != null)
                .filter(v -> v.getListingDate() != null
                        && !v.getListingDate().isBefore(startDate)
                        && !v.getListingDate().isAfter(endDate))
                .map(Vehicle::getListingPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setRevenue(revenue);

        return dto;
    }
}
