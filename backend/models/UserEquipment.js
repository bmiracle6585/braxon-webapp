module.exports = (sequelize, DataTypes) => {
    const UserEquipment = sequelize.define('UserEquipment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        equipment_type: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        manufacturer: {
            type: DataTypes.STRING(255),
            defaultValue: 'N/A'
        },
        model: {
            type: DataTypes.STRING(255)
        },
        serial_number: {
            type: DataTypes.STRING(255),
            defaultValue: 'N/A'
        },
        purchase_date: {
            type: DataTypes.DATEONLY
        },
        assigned_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        condition_status: {
            type: DataTypes.STRING(20),
            defaultValue: 'good'
        },
        signature_data: {
            type: DataTypes.TEXT
        },
        signed_at: {
            type: DataTypes.DATE
        },
        notes: {
            type: DataTypes.TEXT
        },
        created_by: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'user_equipment',
        timestamps: false
    });

    return UserEquipment;
};