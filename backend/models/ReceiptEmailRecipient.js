module.exports = (sequelize, DataTypes) => {
    const ReceiptEmailRecipient = sequelize.define('ReceiptEmailRecipient', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(255),
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        addedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'added_by'
        }
    }, {
        tableName: 'receipt_email_distribution',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true
    });

    return ReceiptEmailRecipient;
};