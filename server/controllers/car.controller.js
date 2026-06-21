import { Car } from "../models/index.js";
import { createOperationLog } from "../utils/operationLog.js";
import { cacheSet, cacheGet, cacheDel } from "../redis.js";

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

export const listCars = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      keyword,
      brand,
      startDate,
      endDate,
    } = req.query;

    const cacheKey = `cars:list:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (brand) query.brand = brand;
    if (keyword) {
      query.$or = [
        { vin: { $regex: keyword, $options: "i" } },
        { plateNumber: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
        { model: { $regex: keyword, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.inStockDate = {};
      if (startDate) query.inStockDate.$gte = new Date(startDate);
      if (endDate) query.inStockDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      Car.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
      Car.countDocuments(query),
    ]);

    const result = {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };

    await cacheSet(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: "车辆不存在" });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCar = async (req, res) => {
  try {
    const car = new Car({
      ...req.body,
      handlerId: req.body.handlerId || MOCK_USER_ID,
    });
    await car.save();

    await createOperationLog({
      action: "create",
      module: "car",
      targetType: "Car",
      targetId: car._id,
      targetName: `${car.brand} ${car.model}`,
      newValue: car.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    await cacheDel("cars:list:*");

    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCar = async (req, res) => {
  try {
    const oldCar = await Car.findById(req.params.id);
    if (!oldCar) {
      return res.status(404).json({ error: "车辆不存在" });
    }

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    await createOperationLog({
      action: "update",
      module: "car",
      targetType: "Car",
      targetId: oldCar._id,
      targetName: `${oldCar.brand} ${oldCar.model}`,
      oldValue: oldCar.toObject(),
      newValue: updatedCar.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    await cacheDel("cars:list:*");

    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: "车辆不存在" });
    }

    await Car.findByIdAndDelete(req.params.id);

    await createOperationLog({
      action: "delete",
      module: "car",
      targetType: "Car",
      targetId: car._id,
      targetName: `${car.brand} ${car.model}`,
      oldValue: car.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    await cacheDel("cars:list:*");

    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
