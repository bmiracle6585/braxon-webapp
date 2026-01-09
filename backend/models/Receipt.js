module.exports = (sequelize, DataTypes) => {
    const Receipt = sequelize.define('Receipt', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        receipt_number: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'other',
            validate: {
                isIn: [['tools', 'materials', 'water', 'hotel', 'gas', 'meals', 'other']]
            }
        },
        expense_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'company',
            validate: {
                isIn: [['company', 'personal']]
            }
        },
        vendor: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        purchase_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        image_path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        thumbnail_path: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'approved', 'rejected', 'exported']]
            }
        },
        approval_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'receipts',
        timestamps: true,
        underscored: true
    });

    return Receipt;
};