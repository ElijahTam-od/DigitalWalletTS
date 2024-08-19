import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class Config{
	private static instance: Config;

	private readonly _dbConnectionString: string;
	private readonly _apiKey: string;
	private readonly _port: number;
    private readonly _jwtSecret: string;

	private constructor() {
        // Initialize configuration properties
        this._port = Number(process.env.PORT);
        this._dbConnectionString = process.env.MONGO_URI as string;
        this._apiKey = process.env.STRIPE_API_KEY as string;
        this._jwtSecret = process.env.JWT_SECRET as string;
    }

    // Singleton pattern to ensure only one instance of the config class
    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

	// Getters to access the private properties
    public get port(): number {
        return this._port;
    }

    public get dbConnectionString(): string {
        return this._dbConnectionString;
    }

    public get apiKey(): string {
        return this._apiKey;
    }

    public get jwtKey(): string{
        return this._jwtSecret;
    }
}
export default Config;



