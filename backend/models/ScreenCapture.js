module.exports = (sequelize, DataTypes) => {
    const ScreenCapture = sequelize.define('ScreenCapture', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id'
            }
        },
        site: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                isIn: [['Site A', 'Site B']]
            }
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        file_size: {
            type: DataTypes.INTEGER
        },
        mime_type: {
            type: DataTypes.STRING(100)
        },
        caption: {
            type: DataTypes.TEXT
        },
        uploaded_by_user_id: {
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
        }
    }, {
        tableName: 'screen_captures',
        timestamps: false
    });

    return ScreenCapture;
};