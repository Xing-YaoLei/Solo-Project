package com.usedcar.dashboard.util;

import com.usedcar.dashboard.dto.DashboardFilter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.StringJoiner;

public class FilterKeyUtil {

    private FilterKeyUtil() {
    }

    public static String buildCacheKey(String prefix, DashboardFilter filter, String shareToken) {
        StringJoiner sj = new StringJoiner("|");

        sj.add(nullSafeList(filter.getStoreIds()));
        sj.add(nullSafe(filter.getStartDate()));
        sj.add(nullSafe(filter.getEndDate()));
        sj.add(nullSafeList(filter.getBrands()));
        sj.add(nullSafeList(filter.getSourceTypes()));
        sj.add(nullSafeList(filter.getVehicleCondition()));
        sj.add(nullSafe(filter.getViewId()));
        sj.add(nullSafe(shareToken));

        String raw = prefix + ":" + sj.toString();
        return sha256(raw).substring(0, 16);
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static String nullSafeList(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "";
        }
        return String.join(",", list);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
