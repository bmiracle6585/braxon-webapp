module.exports = (sequelize, DataTypes) => {
    const UserEmergencyContact = sequelize.define('UserEmergencyContact', {
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
        contact_type: {
            type: DataTypes.ENUM('primary', 'secondary'),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        relationship: {
            type: DataTypes.STRING(100)
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255)
        }
    }, {
        tableName: 'user_emergency_contacts',
        timestamps: false
    });

    return UserEmergencyContact;
};