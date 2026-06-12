// Auto-generated from map.tmx - contains map metadata + store_objects layer for runtime parsing
export const MAP_TMX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="30" height="20" tilewidth="64" tileheight="64" infinite="0" nextlayerid="7" nextobjectid="10">
 <tileset firstgid="1" name="coffee_tiles" tilewidth="64" tileheight="64" tilecount="16" columns="4">
  <tile id="0" type="background">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#2d1e14"/></properties>
  </tile>
  <tile id="1" type="road">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#5a4a3a"/></properties>
  </tile>
  <tile id="2" type="store">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#8b6914"/></properties>
  </tile>
  <tile id="3" type="drop_zone">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#2a5a2a"/></properties>
  </tile>
  <tile id="4" type="store_highlight">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#d4af37"/></properties>
  </tile>
  <tile id="5" type="road_corner">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#4a3a2a"/></properties>
  </tile>
  <tile id="6" type="decoration">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#1e3a1e"/></properties>
  </tile>
  <tile id="7" type="warehouse">
   <image width="64" height="64"><data encoding="base64">(removed)</data></image>
   <properties><property name="color" value="#5a3a1a"/></properties>
  </tile>
 </tileset>
 <layer id="1" name="background" width="30" height="20"><data encoding="csv">0,0,0</data></layer>
 <layer id="2" name="roads" width="30" height="20"><data encoding="csv">0,0,0</data></layer>
 <layer id="3" name="stores" width="30" height="20"><data encoding="csv">0,0,0</data></layer>
 <layer id="4" name="drop_zones" width="30" height="20"><data encoding="csv">0,0,0</data></layer>
 <layer id="5" name="decoration" width="30" height="20" visible="0"><data encoding="csv">0,0,0</data></layer>
 <objectgroup id="6" name="store_objects">
  <object id="1" name="store_main" type="store" x="256" y="192" width="128" height="128">
   <properties>
    <property name="storeId" value="store_main"/>
    <property name="storeName" value="总店"/>
   </properties>
  </object>
  <object id="2" name="store_north" type="store" x="1408" y="256" width="128" height="128">
   <properties>
    <property name="storeId" value="store_north"/>
    <property name="storeName" value="北门店"/>
   </properties>
  </object>
  <object id="3" name="store_east" type="store" x="832" y="832" width="128" height="128">
   <properties>
    <property name="storeId" value="store_east"/>
    <property name="storeName" value="东门店"/>
   </properties>
  </object>
  <object id="4" name="warehouse_main" type="warehouse" x="1344" y="320" width="128" height="128">
   <properties>
    <property name="storeId" value="warehouse_main"/>
    <property name="storeName" value="中央仓库"/>
   </properties>
  </object>
  <object id="5" name="drop_main" type="drop_zone" x="256" y="192" width="128" height="128">
   <properties>
    <property name="targetStoreId" value="store_main"/>
   </properties>
  </object>
  <object id="6" name="drop_north" type="drop_zone" x="1408" y="256" width="128" height="128">
   <properties>
    <property name="targetStoreId" value="store_north"/>
   </properties>
  </object>
  <object id="7" name="drop_east" type="drop_zone" x="832" y="832" width="128" height="128">
   <properties>
    <property name="targetStoreId" value="store_east"/>
   </properties>
  </object>
  <object id="8" name="drop_warehouse" type="drop_zone" x="1344" y="320" width="128" height="128">
   <properties>
    <property name="targetStoreId" value="warehouse_main"/>
   </properties>
  </object>
  <object id="9" name="spawn_supplier" type="spawn_point" x="64" y="64" width="64" height="64">
   <properties>
    <property name="name" value="supplier_spawn"/>
   </properties>
  </object>
 </objectgroup>
</map>
`;
