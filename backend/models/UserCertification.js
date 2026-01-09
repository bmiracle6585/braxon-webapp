module.exports = (sequelize, DataTypes) => {
    const UserCertification = sequelize.define('UserCertification', {
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
        cert_type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        cert_number: {
            type: DataTypes.STRING(100),
            defaultValue: 'N/A'
        },
        cert_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        issue_date: {
            type: DataTypes.DATEONLY
        },
        expiration_date: {
            type: DataTypes.DATEONLY
        },
        file_path: {
            type: DataTypes.STRING(500)
        },
        uploaded_by: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        uploaded_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        notes: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active'
        }
    }, {
        tableName: 'user_certifications',
        timestamps: false
    });

    return UserCertification;
};