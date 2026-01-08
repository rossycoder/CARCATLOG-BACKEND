// Export all models from a single file
module.exports = {
  User: require('./User'),
  Car: require('./Car'),
  Bike: require('./Bike'),
  Inquiry: require('./Inquiry'),
  NewsPost: require('./NewsPost'),
  VehicleHistory: require('./VehicleHistory'),
  AdvertisingPackagePurchase: require('./AdvertisingPackagePurchase'),
  // Trade Subscription Models
  TradeDealer: require('./TradeDealer'),
  SubscriptionPlan: require('./SubscriptionPlan'),
  TradeSubscription: require('./TradeSubscription'),
  ListingView: require('./ListingView'),
  Van: require('./Van')
};
