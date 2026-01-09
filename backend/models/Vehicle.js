module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define('Vehicle', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        make: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        model: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        license_plate: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        vin: {
            type: DataTypes.STRING(17),
            allowNull: false,
            unique: true
        },
        color: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        current_mileage: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active'
        },
        assigned_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        assigned_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        last_inspection_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        registration_expiration: {
            type: DataTypes.DATE,
            allowNull: true
        },
        insurance_expiration: {
            type: DataTypes.DATE,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'vehicles',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Vehicle;
};