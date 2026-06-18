package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.entity.ShareLink;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ShareLinkMapper {

    ShareLink selectByToken(@Param("token") String token);

    int insert(ShareLink s);

    int revokeByToken(@Param("token") String token);
}
