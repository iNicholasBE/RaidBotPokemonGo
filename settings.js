function Settings() {

    // You can request a Bot token by starting a telegram conversation with @BotFather
    // After setup of your bot, send a first message to your own raidbot to get your personal user id.
    // This user ID we'll use to send message to your Telegram account when a raid lobby is filling up.
    this.telegramUserID = "";
    this.telegramBotID = "";

    // Be sure to add your personal PTC username, password and Bossland hashingKey here
    // Hashing keys can be purchased through https://www.bossland.shop/products/hashing-service-150-rpm
    this.ptcUsername = "";
    this.ptcPassword = "";
    this.hashingKey = "";

    //Set your start coordinates
    this.lat = 51.2251687;
    this.long = 4.4082454;
}

module.exports = Settings;