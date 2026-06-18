package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.entity.FilterView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FilterViewMapper {

    FilterView selectByViewId(@Param("viewId") String viewId);

    List<FilterView> selectAll();

    FilterView selectDefault();

    int resetAllDefault();

    int insert(FilterView v);

    int update(FilterView v);

    int deleteById(@Param("id") Long id);
}
