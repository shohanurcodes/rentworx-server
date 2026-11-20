import type { IEquipment } from "../models/Equipment";

export function equipmentCard(item: IEquipment) {
  return {
    id: item._id!.toString(),
    name: item.name,
    category: item.category,
    location: item.location,
    price: item.price,
    rentalType: item.rentalType,
    image: item.image,
    condition: item.condition,
    ratingAverage: item.ratingAverage ?? 0,
    reviewCount: item.reviewCount ?? 0,
    availableQuantity: item.availableQuantity,
  };
}
